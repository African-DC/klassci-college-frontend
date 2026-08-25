"use client"

import { useState } from "react"
import { RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DestructiveActionDialog } from "@/components/shared/DestructiveActionDialog"
import { usePurgeEntity, useRestoreEntity } from "@/lib/hooks/useArchive"
import { isArchivableEntity, type ArchiveEntry } from "@/lib/contracts/archive"
import { entityLabel } from "@/components/admin/audit/audit-labels"
import { cn } from "@/lib/utils"

interface ArchiveRowActionsProps {
  entry: ArchiveEntry
  /** Vrai seulement pour qui détient `archive:purge`. */
  canPurge: boolean
  /** `true` sur les cartes tactiles : les boutons occupent toute la largeur. */
  stacked?: boolean
}

/**
 * Les deux issues possibles pour une fiche archivée.
 *
 * Restaurer est un bouton simple : ce geste répare, il ne détruit rien, et
 * l'entourer de confirmations le rendrait aussi intimidant que la purge.
 * Supprimer définitivement passe, lui, par le motif puis le maintien de dix
 * secondes.
 */
export function ArchiveRowActions({ entry, canPurge, stacked = false }: ArchiveRowActionsProps) {
  const [purgeOpen, setPurgeOpen] = useState(false)
  const restore = useRestoreEntity()
  const purge = usePurgeEntity()

  // Un type inconnu du frontend ne doit pas devenir une URL devinée : on
  // n'affiche aucune action plutôt que d'appeler une route au hasard.
  if (!isArchivableEntity(entry.entity_type)) return null
  const entity = entry.entity_type

  const subject = entry.label ?? `${entityLabel(entity)} nº ${entry.entity_id}`
  const isBusy = restore.isPending || purge.isPending
  const buttonWidth = stacked && "flex-1"

  return (
    <div className={cn("flex gap-2", !stacked && "justify-end")}>
      <Button
        type="button"
        variant="outline"
        className={cn("h-11 sm:h-9", buttonWidth)}
        disabled={isBusy}
        onClick={() => restore.mutate({ entity, id: entry.entity_id })}
        aria-label={`Restaurer ${subject}`}
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        <span>Restaurer</span>
      </Button>

      {canPurge && (
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-11 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-9",
            buttonWidth,
          )}
          disabled={isBusy}
          onClick={() => setPurgeOpen(true)}
          aria-label={`Supprimer définitivement ${subject}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span>Supprimer</span>
        </Button>
      )}

      <DestructiveActionDialog
        open={purgeOpen}
        onOpenChange={setPurgeOpen}
        title="Supprimer définitivement"
        description="Cette fiche et son historique quitteront l'établissement pour de bon."
        subject={subject}
        consequence="Aucune restauration ne sera possible, ni par vous, ni par la direction, ni par KLASSCI."
        seconds={10}
        confirmLabel="Maintenir pour supprimer"
        holdingLabel="Ne relâchez pas"
        tone="danger"
        isPending={purge.isPending}
        onConfirm={(reason) => {
          purge.mutate(
            { entity, id: entry.entity_id, reason },
            { onSuccess: () => setPurgeOpen(false) },
          )
        }}
      />
    </div>
  )
}
