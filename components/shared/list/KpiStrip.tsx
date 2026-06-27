import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Bande de KPI compacte pour les listes admin/portails. Réutilise le langage
 * visuel des dashboards (Card shadcn neutre + système de tons restreint).
 *
 * Tons : default (muted) · primary (bleu KLASSCI) · accent (orange) ·
 * destructive (alerte) · emerald (positif). Garder 1 ton structurant max par
 * strip pour rester monochrome (règle « 1 accent + monochrome »).
 */
export type KpiTone = "default" | "primary" | "accent" | "destructive" | "emerald"

// Couleurs de marque KLASSCI franchement présentes : carte teintée + pastille
// d'icône pleine (bleu / orange / vert). Sémantique conservée, clair/sombre OK.
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

export interface KpiItem {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  tone?: KpiTone
}

interface KpiStripProps {
  items: KpiItem[]
  /** Nombre de colonnes au plus large breakpoint (par défaut 4). */
  columns?: 2 | 3 | 4
  className?: string
}

const colClass: Record<2 | 3 | 4, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
}

export function KpiStrip({ items, columns = 4, className }: KpiStripProps) {
  if (items.length === 0) return null
  return (
    <div className={cn("grid gap-3", colClass[columns], className)}>
      {items.map((item, i) => {
        const Icon = item.icon
        const valueText =
          typeof item.value === "string" || typeof item.value === "number"
            ? String(item.value)
            : ""
        return (
          <Card
            key={i}
            role="group"
            aria-label={valueText ? `${item.label} : ${valueText}` : item.label}
            className={cn("shadow-sm", toneCard[item.tone ?? "default"])}
          >
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                <div className="text-2xl font-bold tracking-tight tabular-nums">
                  {item.value}
                </div>
                {item.hint && (
                  <div className="text-[11px] text-muted-foreground">{item.hint}</div>
                )}
              </div>
              {Icon && (
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm",
                    toneIcon[item.tone ?? "default"],
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
