import { Badge } from "@/components/ui/badge"

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  approved: { label: "Approuvé", className: "bg-emerald-600 text-white hover:bg-emerald-600/90" },
  rejected: { label: "Refusé", className: "bg-destructive text-destructive-foreground" },
  cancelled: { label: "Annulé", className: "bg-muted text-muted-foreground" },
}

export function LeaveStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: "bg-muted text-muted-foreground" }
  return <Badge className={s.className}>{s.label}</Badge>
}

export function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
  const s = new Date(start).toLocaleDateString("fr-FR", opts)
  const e = new Date(end).toLocaleDateString("fr-FR", opts)
  return s === e ? s : `${s} → ${e}`
}

export function dayCount(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}
