"use client"

import { Check, ListChecks, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AllocationMode } from "./useAllocationDraft"

const OPTIONS: {
  value: AllocationMode
  icon: typeof Wand2
  title: string
  hint: string
}[] = [
  {
    value: "auto",
    icon: Wand2,
    title: "Répartition automatique",
    hint: "Les frais les plus prioritaires sont soldés d'abord",
  },
  {
    value: "manual",
    icon: ListChecks,
    title: "Je répartis moi-même",
    hint: "Un montant par frais, le reste part automatiquement",
  },
]

/**
 * Le choix de la répartition, deux cartes empilées sur téléphone.
 *
 * L'état retenu ne tient pas qu'à la couleur : la carte active porte une
 * coche et se décrit en `aria-checked`, pour rester lisible sur un écran
 * délavé par le soleil comme pour un lecteur d'écran.
 */
export function AllocationModeChoice({
  value,
  onChange,
  disabled,
}: {
  value: AllocationMode
  onChange: (mode: AllocationMode) => void
  disabled?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Répartition du versement"
      className="grid gap-2 sm:grid-cols-2"
    >
      {OPTIONS.map((option) => {
        const active = value === option.value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-11 w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card hover:bg-muted/50",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                active ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">
                {option.title}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {option.hint}
              </span>
            </span>
            {active ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
