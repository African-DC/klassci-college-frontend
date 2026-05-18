"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

// =============================================================================
// Status pill — uniforme dans tous les tabs (suit le pattern Timeline)
// =============================================================================

type PillTone = "primary" | "success" | "warning" | "danger" | "neutral" | "accent"

const PILL_STYLES: Record<PillTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  neutral: "bg-muted text-muted-foreground",
  accent: "text-[#F58220]",
}

export function StatusPill({
  tone = "neutral",
  className,
  children,
}: {
  tone?: PillTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        PILL_STYLES[tone],
        tone === "accent" && "bg-[rgba(245,130,32,0.12)]",
        className,
      )}
    >
      {children}
    </span>
  )
}

// =============================================================================
// Section card — pattern uniforme avec icône, titre serif, action droite
// =============================================================================

interface SectionCardProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function SectionCard({
  icon,
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: SectionCardProps) {
  return (
    <Card className={cn("overflow-hidden border-0 shadow-sm ring-1 ring-border", className)}>
      <CardContent className={cn("p-4 sm:p-5", bodyClassName)}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <h3 className="font-serif text-base leading-none tracking-tight">{title}</h3>
              {description && (
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Empty state — uniforme partout (suit la rule empty-state-by-role.md)
// =============================================================================

interface EmptyStateProps {
  icon: ReactNode
  title: string
  message?: string
  cta?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, message, cta, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl bg-muted/20 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {message && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{message}</p>}
      </div>
      {cta}
    </div>
  )
}

// =============================================================================
// Field row — libellé / valeur pour les fiches d'identité
// =============================================================================

export function FieldRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  const isEmpty = value === null || value === undefined || value === ""
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-2.5 last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span
        className={cn(
          "max-w-[60%] text-right text-sm font-medium",
          isEmpty && "text-muted-foreground/50",
          mono && "font-mono text-xs",
        )}
      >
        {isEmpty ? "—" : value}
      </span>
    </div>
  )
}

// =============================================================================
// Initiales avatar — pour parents/contacts sans photo
// =============================================================================

export function InitialsAvatar({
  first,
  last,
  size = "md",
  tone = "primary",
}: {
  first?: string | null
  last?: string | null
  size?: "sm" | "md" | "lg"
  tone?: "primary" | "accent" | "neutral"
}) {
  const initials = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?"
  const sizeClasses = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  }
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-[rgba(245,130,32,0.12)] text-[#F58220]",
    neutral: "bg-muted text-muted-foreground",
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-semibold ring-2 ring-background",
        sizeClasses[size],
        toneClasses[tone],
      )}
    >
      {initials}
    </div>
  )
}
