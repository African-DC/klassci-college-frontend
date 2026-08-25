import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Tons sémantiques restreints (règle "1 accent + monochrome") :
 * - default : icône muted, base monochrome
 * - primary : bleu KLASSCI, métrique structurante (élèves)
 * - accent  : orange KLASSCI, action/argent (paiements)
 * - destructive : alerte active (> 0)
 */
type KpiTone = "default" | "primary" | "accent" | "destructive"

const toneStyles: Record<KpiTone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
}

interface KpiCardProps {
  title: string
  value: React.ReactNode
  description?: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone?: KpiTone
  className?: string
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
  className,
}: KpiCardProps) {
  // aria-label : nom accessible complet (titre + valeur) pour lecteurs d'écran.
  // role=group + aria-live=polite annonce les revalidations TanStack Query.
  const valueText = typeof value === "string" || typeof value === "number" ? String(value) : ""
  const accessibleLabel = valueText ? `${title} : ${valueText}` : title

  return (
    <Card
      role="group"
      aria-label={accessibleLabel}
      aria-live="polite"
      aria-atomic="true"
      className={cn("shadow-sm", className)}
    >
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-3xl font-bold tracking-tight tabular-nums">{value}</div>
          {description && (
            <div className="pt-1 text-xs text-muted-foreground">{description}</div>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            toneStyles[tone],
          )}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
