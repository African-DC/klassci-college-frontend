"use client"

import { cn } from "@/lib/utils"

/**
 * Chips de filtre horizontaux (1 tap = 1 filtre), pattern persona-first repris
 * de la page Élèves. Mono-sélection : une valeur active, `value` contrôlée par
 * le parent. Scroll horizontal sur mobile, touch target h-9/h-11.
 *
 * Le `count` est optionnel (certaines dimensions n'ont pas de compteur).
 */
export type ChipTone = "default" | "warning" | "destructive"

export interface FilterChipOption {
  value: string
  label: string
  count?: number
  tone?: ChipTone
}

interface FilterChipsProps {
  options: FilterChipOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  "aria-label"?: string
}

const activeToneClass: Record<ChipTone, string> = {
  default: "border-primary bg-primary text-primary-foreground",
  warning: "border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  destructive: "border-destructive bg-destructive text-destructive-foreground",
}

const activeBadgeClass: Record<ChipTone, string> = {
  default: "bg-primary-foreground/20 text-primary-foreground",
  warning: "bg-amber-200 text-amber-900",
  destructive: "bg-destructive-foreground/20 text-destructive-foreground",
}

export function FilterChip({
  label,
  count,
  isActive,
  onClick,
  tone = "default",
}: {
  label: string
  count?: number
  isActive: boolean
  onClick: () => void
  tone?: ChipTone
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors sm:h-9",
        isActive
          ? activeToneClass[tone]
          : "border-border bg-muted/40 text-foreground hover:bg-muted",
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
            isActive ? activeBadgeClass[tone] : "bg-background text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

export function FilterChips({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel ?? "Filtres"}
      className={cn("flex gap-2 overflow-x-auto pb-1", className)}
    >
      {options.map((opt) => (
        <FilterChip
          key={opt.value}
          label={opt.label}
          count={opt.count}
          tone={opt.tone}
          isActive={value === opt.value}
          onClick={() => onChange(opt.value)}
        />
      ))}
    </div>
  )
}
