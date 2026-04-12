import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

type KpiVariant = "blue" | "orange" | "emerald" | "rose"

const variantStyles: Record<KpiVariant, { bg: string; icon: string; ring: string }> = {
  blue: {
    bg: "bg-primary/8 dark:bg-primary/15",
    icon: "text-primary",
    ring: "ring-primary/20",
  },
  orange: {
    bg: "bg-accent/10 dark:bg-accent/15",
    icon: "text-accent",
    ring: "ring-accent/20",
  },
  emerald: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    icon: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
  },
  rose: {
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    icon: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/20",
  },
}

interface KpiCardProps {
  title: string
  value: React.ReactNode
  description?: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  variant?: KpiVariant
  trend?: {
    value: number
    positive: boolean
  }
  className?: string
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "blue",
  trend,
  className,
}: KpiCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={cn("relative overflow-hidden border-0 shadow-sm ring-1", styles.ring, className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                )}
              >
                {trend.positive ? "+" : ""}{trend.value}% vs mois dernier
              </p>
            )}
          </div>
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", styles.bg)}>
            <Icon className={cn("h-6 w-6", styles.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
