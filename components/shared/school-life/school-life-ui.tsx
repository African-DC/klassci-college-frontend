import { Badge } from "@/components/ui/badge"
import { summonsOutcomeLabel } from "@/lib/contracts/school-life"

const OUTCOME_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  attended: "bg-emerald-600 text-white hover:bg-emerald-600/90",
  missed: "bg-destructive text-destructive-foreground",
}

/** Suite donnée à une convocation : venu, pas venu, ou pas encore renseigné. */
export function SummonsOutcomeBadge({ outcome, label }: { outcome: string; label?: string }) {
  return (
    <Badge className={OUTCOME_STYLES[outcome] ?? "bg-muted text-muted-foreground"}>
      {label ?? summonsOutcomeLabel(outcome)}
    </Badge>
  )
}

/** Date ISO en français court, robuste aux valeurs vides du backend. */
export function formatSchoolDate(raw?: string | null): string {
  if (!raw) return "Date inconnue"
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return "Date inconnue"
  return parsed.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}

/** « 14:30:00 » du backend devient « 14h30 ». */
export function formatSchoolTime(raw?: string | null): string {
  if (!raw) return ""
  const [hours, minutes] = raw.split(":")
  if (!hours || !minutes) return raw
  return `${hours}h${minutes}`
}

/** Période d'un billet : une seule date quand début et fin se confondent. */
export function formatPeriod(start: string, end: string): string {
  const from = formatSchoolDate(start)
  const to = formatSchoolDate(end)
  return from === to ? from : `${from} au ${to}`
}
