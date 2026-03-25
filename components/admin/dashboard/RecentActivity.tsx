import {
  UserPlus,
  CreditCard,
  ClipboardList,
  CalendarDays,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: number
  icon: LucideIcon
  label: string
  detail: string
  time: string
  variant: "blue" | "orange" | "emerald" | "violet" | "rose"
}

const variantStyles: Record<ActivityItem["variant"], string> = {
  blue: "bg-primary/10 text-primary",
  orange: "bg-accent/10 text-accent",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

// Données de démo — sera remplacé par l'API /dashboard/activity
const activities: ActivityItem[] = [
  {
    id: 1,
    icon: UserPlus,
    label: "Nouvelle inscription",
    detail: "Jean Mbala — 3ème B",
    time: "Il y a 12 min",
    variant: "blue",
  },
  {
    id: 2,
    icon: CreditCard,
    label: "Paiement reçu",
    detail: "Marie Loko — 45 000 FC",
    time: "Il y a 28 min",
    variant: "orange",
  },
  {
    id: 3,
    icon: ClipboardList,
    label: "Notes saisies",
    detail: "Maths 4ème A — M. Kabongo",
    time: "Il y a 1h",
    variant: "emerald",
  },
  {
    id: 4,
    icon: CalendarDays,
    label: "Emploi du temps modifié",
    detail: "6ème C — Lundi matin",
    time: "Il y a 2h",
    variant: "violet",
  },
  {
    id: 5,
    icon: AlertTriangle,
    label: "Alerte absence",
    detail: "3 absences non justifiées — 5ème A",
    time: "Il y a 3h",
    variant: "rose",
  },
]

export function RecentActivity() {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  variantStyles[activity.variant]
                )}
              >
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none">{activity.label}</p>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {activity.detail}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
