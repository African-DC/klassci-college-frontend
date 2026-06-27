import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Tons aux couleurs KLASSCI, franchement présents (carte teintée + pastille
 * d'icône pleine) tout en restant sémantiques. Compatibles clair/sombre.
 * - primary : bleu KLASSCI (métrique structurante)
 * - accent  : orange KLASSCI (action / argent)
 * - emerald : positif (payé, validé)
 * - destructive : alerte active
 */
type KpiTone = "default" | "primary" | "accent" | "destructive" | "emerald"

const toneCard: Record<KpiTone, string> = {
  default: "",
  primary: "border-primary/25 bg-primary/[0.06]",
  accent: "border-accent/30 bg-accent/[0.07]",
  destructive: "border-destructive/30 bg-destructive/[0.07]",
  emerald: "border-emerald-500/30 bg-emerald-500/[0.07]",
}

const toneIcon: Record<KpiTone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  emerald: "bg-emerald-600 text-white",
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
      className={cn("shadow-sm", toneCard[tone], className)}
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
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg shadow-sm",
            toneIcon[tone],
          )}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
