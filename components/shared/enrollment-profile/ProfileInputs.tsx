"use client"

import { Check } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

/** Radix refuse une valeur vide : « pas renseigné » voyage sous ce nom. */
const NONE = "__none"

interface OptionSelectProps<T extends string> {
  id: string
  value: T | null
  options: { value: T; label: string }[]
  onChange: (value: T | null) => void
  disabled?: boolean
  /** Libellé de l'option vide, et de la valeur affichée quand rien n'est choisi. */
  emptyLabel?: string
  /** Nom accessible, pour les cellules de tableau sans libellé visible. */
  ariaLabel?: string
  className?: string
}

/**
 * Un choix dans une liste fermée, avec toujours une sortie « Non renseigné ».
 *
 * L'école complète cette année ce qu'elle sait ; ce qu'elle ne sait pas reste
 * vide. Un choix qu'on ne pourrait plus défaire forcerait une réponse fausse.
 */
export function OptionSelect<T extends string>({
  id,
  value,
  options,
  onChange,
  disabled,
  emptyLabel = "Non renseigné",
  ariaLabel,
  className,
}: OptionSelectProps<T>) {
  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? null : (v as T))}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn("h-11", className)}>
        <SelectValue placeholder={emptyLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{emptyLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const REPEATER_CHOICES: { value: boolean | null; label: string }[] = [
  { value: true, label: "Redoublant" },
  { value: false, label: "Non redoublant" },
  { value: null, label: "Non renseigné" },
]

interface RepeaterChoiceProps {
  value: boolean | null
  onChange: (value: boolean | null) => void
  disabled?: boolean
  /** Nom du groupe pour les lecteurs d'écran (« Qualité de Koné Awa »). */
  label: string
  compact?: boolean
}

/**
 * Qualité en trois réponses écrites, jamais une case à cocher.
 *
 * Décochée, une case affirmerait « Non redoublant » pour un élève dont on ne
 * sait rien, et la fiche remise au ministère mentirait.
 */
export function RepeaterChoice({ value, onChange, disabled, label, compact }: RepeaterChoiceProps) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-3 gap-1.5">
      {REPEATER_CHOICES.map((choice) => {
        const selected = value === choice.value
        return (
          <button
            key={String(choice.value)}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(choice.value)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1 rounded-md border px-2 text-center transition-colors",
              compact ? "text-xs" : "text-sm",
              "disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-primary bg-primary/10 font-semibold text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50",
            )}
          >
            {selected ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
            <span className="leading-tight">{choice.label}</span>
          </button>
        )
      })}
    </div>
  )
}
