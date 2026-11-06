"use client"

import Link from "next/link"
import { ArrowUpRight, CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatFcfa } from "@/lib/utils/money"
import {
  scheduleSourceLabelForRow,
  scheduleStatusLabel,
  type ScheduleOverviewRow,
} from "@/lib/contracts/installment-overview"

function dateLabel(iso: string | null | undefined) {
  if (!iso) return "Aucune échéance à venir"
  const [year, month, day] = iso.split("-")
  return [day, month, year].join("/")
}

function StateBadge({ row }: { row: ScheduleOverviewRow }) {
  const danger = row.state === "late"
  const success = row.state === "settled"
  return (
    <Badge
      variant={danger ? "destructive" : "secondary"}
      className={
        success ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300" :
        row.state === "partial_schedule" ? "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300" :
        undefined
      }
    >
      {scheduleStatusLabel(row.state)}
    </Badge>
  )
}

/** Même données, deux densités : tableau lisible au bureau, cartes tactiles au téléphone. */
export function ScheduleOverviewRows({ rows }: { rows: ScheduleOverviewRow[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              {["Élève / classe", "Statut", "Montant dû", "Déjà versé", "Exigible", "Retard", "Prochaine échéance"].map((label) => (
                <th scope="col" key={label} className="px-4 py-3 text-left font-semibold">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.enrollment_id} className="hover:bg-muted/35">
                <td className="max-w-64 px-4 py-3">
                  <Link
                    className="inline-flex max-w-full items-center gap-1 font-semibold text-foreground hover:text-primary"
                    href={`/admin/enrollments/${row.enrollment_id}`}
                  >
                    <span className="truncate">{row.student_name}</span>
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {row.class_name} · {row.matricule || "Sans matricule"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StateBadge row={row} />
                  <div className="mt-1 text-xs text-muted-foreground">{scheduleSourceLabelForRow(row.source)}</div>
                </td>
                <td className="px-4 py-3 font-medium tabular-nums">{formatFcfa(row.total_due)}</td>
                <td className="px-4 py-3 tabular-nums">{formatFcfa(row.total_paid)}</td>
                <td className="px-4 py-3 tabular-nums">{formatFcfa(row.due_so_far)}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">
                  <span className={row.late_amount > 0 ? "text-destructive" : ""}>
                    {formatFcfa(row.late_amount)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span>{dateLabel(row.next_due_date)}</span>
                  {row.next_due_amount != null && (
                    <div className="text-xs text-muted-foreground">{formatFcfa(row.next_due_amount)}</div>
                  )}
                  {row.unscheduled_amount > 0 && (
                    <div className="text-xs text-amber-700 dark:text-amber-400">
                      {formatFcfa(row.unscheduled_amount)} non planifiés
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y lg:hidden">
        {rows.map((row) => (
          <li key={row.enrollment_id} className="space-y-3 p-4">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/enrollments/${row.enrollment_id}`}
                  className="inline-flex max-w-full items-center gap-1 font-semibold hover:text-primary"
                >
                  <span className="truncate">{row.student_name}</span>
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                </Link>
                <p className="text-xs text-muted-foreground">
                  {row.class_name} · {row.matricule || "Sans matricule"}
                </p>
              </div>
              <StateBadge row={row} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
              {([
                ["Total dû", row.total_due],
                ["Déjà versé", row.total_paid],
                ["Exigible aujourd'hui", row.due_so_far],
                ["Retard", row.late_amount],
              ] as const).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className={`font-semibold tabular-nums ${label === "Retard" && value > 0 ? "text-destructive" : ""}`}>
                    {formatFcfa(value)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Prochaine : {dateLabel(row.next_due_date)}</span>
              {row.next_due_amount != null && <span>· {formatFcfa(row.next_due_amount)}</span>}
              <span>· {scheduleSourceLabelForRow(row.source)}</span>
            </div>
            {row.unscheduled_amount > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {formatFcfa(row.unscheduled_amount)} n'ont pas encore de date d'échéance.
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
