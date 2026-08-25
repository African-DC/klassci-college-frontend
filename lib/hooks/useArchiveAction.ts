"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import { useArchiveEntity } from "./useArchive"
import { usePermissions } from "./usePermissions"
import { ARCHIVABLE_ENTITIES, type ArchivableEntity } from "@/lib/contracts/archive"

export interface ArchiveAction {
  /** Faux tant que le droit n'est pas confirmé : on masque plutôt que griser. */
  canArchive: boolean
  isOpen: boolean
  setOpen: (open: boolean) => void
  open: () => void
  isPending: boolean
  confirm: (reason: string) => void
}

interface UseArchiveActionParams {
  entity: ArchivableEntity
  id: number
  /** Où repartir une fois la fiche archivée, puisqu'elle n'existe plus ici. */
  listRoute: Route
}

/**
 * Le geste « archiver » d'une fiche détail : le droit, l'état du dialogue, la
 * mutation et le retour à la liste, en un seul endroit.
 *
 * Regroupé dans un hook parce que les cinq fiches en ont exactement besoin :
 * dupliquer ces quinze lignes cinq fois garantit qu'un jour l'une d'elles
 * oubliera le contrôle de droit ou la redirection.
 *
 * Le toast de succès et le message d'erreur du serveur viennent de
 * `useArchiveEntity` : le refus d'archiver une inscription qui porte des
 * versements doit s'afficher tel que le backend l'a écrit, pas reformulé ici.
 */
export function useArchiveAction({ entity, id, listRoute }: UseArchiveActionParams): ArchiveAction {
  const router = useRouter()
  const [isOpen, setOpen] = useState(false)
  const { has } = usePermissions()
  const archive = useArchiveEntity()

  return {
    canArchive: has(ARCHIVABLE_ENTITIES[entity].deletePermission),
    isOpen,
    setOpen,
    open: () => setOpen(true),
    isPending: archive.isPending,
    confirm: (reason: string) => {
      archive.mutate(
        { entity, id, reason },
        {
          onSuccess: () => {
            setOpen(false)
            // La fiche vient de quitter tous les écrans : rester dessus
            // afficherait une page vidée de son objet, ou une erreur.
            router.push(listRoute)
          },
          // En cas de refus du serveur on laisse le dialogue ouvert : le motif
          // déjà saisi reste disponible pour une seconde tentative.
        },
      )
    },
  }
}
