"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { FeeVariantAudienceBadges } from "./FeeVariantAudienceBadges"
import type { FeeVariant } from "@/lib/contracts/fee"

/**
 * Ce qu'on recopie, ligne par ligne, avec de quoi le reconnaître.
 *
 * Un même niveau porte autant de lignes que de publics visés. Les afficher
 * sans leurs repères, c'est proposer à l'école de cocher deux montants qui
 * paraissent identiques, et lui faire découvrir sur la catégorie cible qu'elle
 * en a copié un seul.
 */
export function FeeVariantCopyList({
  variants,
  selected,
  onToggle,
  levelNameMap,
}: {
  variants: FeeVariant[]
  selected: Set<number>
  onToggle: (id: number) => void
  levelNameMap: Map<number, string>
}) {
  if (variants.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
        Cette catégorie n&apos;a encore aucun montant à copier.
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">Niveaux à copier</p>
      <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">
        {variants.map((v) => (
          <label
            key={v.id}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <Checkbox checked={selected.has(v.id)} onCheckedChange={() => onToggle(v.id)} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">
                {levelNameMap.get(v.level_id) ?? `#${v.level_id}`}
              </span>
              <FeeVariantAudienceBadges variant={v} className="mt-1" />
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {v.amount.toLocaleString("fr-FR")} FCFA
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
