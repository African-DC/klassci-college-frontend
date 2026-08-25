"use client"

import { ARCHIVABLE_ENTITIES } from "@/lib/contracts/archive"
import { cn } from "@/lib/utils"

interface ArchiveFilterChipsProps {
  /** `undefined` = aucun filtre, on montre toute la corbeille. */
  value: string | undefined
  onChange: (entityType: string | undefined) => void
}

const CHIPS: Array<{ value: string | undefined; label: string }> = [
  { value: undefined, label: "Tout" },
  ...Object.entries(ARCHIVABLE_ENTITIES).map(([key, meta]) => ({
    value: key,
    label: meta.plural,
  })),
]

/**
 * Pastilles de filtre par type de fiche.
 *
 * Des boutons plutôt qu'une liste déroulante : sur un téléphone d'entrée de
 * gamme, un menu qui s'ouvre coûte deux gestes et masque l'écran. Ici tout
 * est visible d'un coup, et la pastille active se lit à la couleur.
 */
export function ArchiveFilterChips({ value, onChange }: ArchiveFilterChipsProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filtrer la corbeille par type de fiche"
    >
      {CHIPS.map((chip) => {
        const isActive = chip.value === value
        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => onChange(chip.value)}
            aria-pressed={isActive}
            className={cn(
              "inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors sm:h-9",
              isActive
                ? "border-transparent bg-accent text-accent-foreground shadow-sm"
                : "border-input bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
