"use client"

import { Badge } from "@/components/ui/badge"
import { entityLabel, formatStamp } from "@/components/admin/audit/audit-labels"
import type { ArchiveEntry } from "@/lib/contracts/archive"
import { ArchiveRowActions } from "./ArchiveRowActions"

interface ArchiveCardsProps {
  items: ArchiveEntry[]
  canPurge: boolean
}

/**
 * Vue tactile de la corbeille.
 *
 * Un tableau à six colonnes sur un écran de six centimètres force le zoom et
 * le défilement latéral. Ici chaque fiche est une carte, et les deux actions
 * sont posées en bas, à portée du pouce.
 */
export function ArchiveCards({ items, canPurge }: ArchiveCardsProps) {
  return (
    <div className="space-y-3 md:hidden">
      {items.map((entry) => {
        const stamp = entry.archived_at ? formatStamp(entry.archived_at) : null
        return (
          <div
            key={`${entry.entity_type}-${entry.entity_id}`}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {entry.label ?? `Fiche nº ${entry.entity_id}`}
                </p>
                <p className="text-xs text-muted-foreground">nº {entry.entity_id}</p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {entityLabel(entry.entity_type)}
              </Badge>
            </div>

            <div className="mt-3 rounded-md border border-border/60 bg-muted/40 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Motif
              </p>
              <p className="mt-0.5 text-sm">
                {entry.archive_reason ?? "Aucun motif enregistré"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Par {entry.archived_by_name ?? "auteur inconnu"}
                {stamp ? ` le ${stamp.date} à ${stamp.time}` : ""}
              </p>
            </div>

            <div className="mt-3">
              <ArchiveRowActions entry={entry} canPurge={canPurge} stacked />
            </div>
          </div>
        )
      })}
    </div>
  )
}
