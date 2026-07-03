"use client"

import { Coins, UserPlus, Clock, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatXof } from "@/lib/export/format"
import type { StaffFull } from "@/lib/contracts/staff"

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-1.5 text-2xl font-bold leading-none tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function StaffActivityTab({ fullData }: { fullData?: StaffFull }) {
  const activity = fullData?.activity
  const lastLogin = fullData?.user_last_login
  const lastLoginLabel = lastLogin
    ? new Date(lastLogin).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "Jamais connecté"

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="text-sm font-semibold">Activité de l&apos;année</h2>
          {activity?.academic_year_name && (
            <p className="text-xs text-muted-foreground">Année {activity.academic_year_name}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            icon={Coins}
            label="Versements encaissés"
            value={activity?.payments_count ?? 0}
            hint={
              activity && activity.payments_count > 0
                ? formatXof(activity.payments_amount)
                : "Aucun encaissement"
            }
          />
          <StatTile
            icon={UserPlus}
            label="Inscriptions traitées"
            value={activity?.enrollments_count ?? 0}
          />
          <StatTile icon={Clock} label="Dernière connexion" value={lastLoginLabel} />
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Ces indicateurs reflètent le volume d&apos;activité de ce membre du personnel sur
            l&apos;année en cours (versements qu&apos;il a encaissés, inscriptions qu&apos;il a
            enregistrées). Ce n&apos;est pas une note de performance.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
