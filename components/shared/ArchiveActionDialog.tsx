"use client"

import { DestructiveActionDialog } from "@/components/shared/DestructiveActionDialog"
import type { ArchivableEntity } from "@/lib/contracts/archive"
import type { ArchiveAction } from "@/lib/hooks/useArchiveAction"

/**
 * Libellé du geste, accordé au genre de chaque fiche.
 *
 * Sert à la fois l'entrée de menu et le titre du dialogue : la personne doit
 * relire exactement la phrase sur laquelle elle vient de cliquer, sinon elle
 * doute d'avoir ouvert la bonne fenêtre.
 */
export const ARCHIVE_MENU_LABEL: Record<ArchivableEntity, string> = {
  student: "Archiver l'élève",
  parent: "Archiver le parent",
  teacher: "Archiver l'enseignant",
  staff: "Archiver le membre du personnel",
  enrollment: "Archiver l'inscription",
}

interface ArchiveActionDialogProps {
  action: ArchiveAction
  entity: ArchivableEntity
  /** Le libellé de la fiche visée, rappelé pour éviter l'erreur de ligne. */
  subject: string
}

/**
 * La confirmation d'archivage, réglée sur cinq secondes de maintien.
 *
 * Cinq et non dix : archiver se répare depuis la corbeille. Les dix secondes
 * restent réservées à la suppression définitive, qui, elle, ne se rattrape pas.
 */
export function ArchiveActionDialog({ action, entity, subject }: ArchiveActionDialogProps) {
  return (
    <DestructiveActionDialog
      open={action.isOpen}
      onOpenChange={action.setOpen}
      title={ARCHIVE_MENU_LABEL[entity]}
      description="La fiche quitte les listes et les écrans, sans rien supprimer. Elle reste restaurable depuis la corbeille."
      subject={subject}
      seconds={5}
      confirmLabel="Maintenir pour archiver"
      holdingLabel="Ne relâchez pas"
      tone="warning"
      isPending={action.isPending}
      onConfirm={action.confirm}
    />
  )
}
