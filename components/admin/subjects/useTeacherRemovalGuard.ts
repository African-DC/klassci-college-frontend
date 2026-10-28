"use client"

import { useState } from "react"
import { toast } from "sonner"
import { getSubjectSlotCounts } from "@/lib/api/subjects"

interface PendingRemoval {
  slots: number
  onProceed: () => void
}

/**
 * Retrait d'enseignants d'une matière : si des créneaux existants leur
 * appartiennent, la sauvegarde attend la confirmation de l'utilisateur.
 * En cas d'échec de la vérification, rien n'est enregistré.
 */
export function useTeacherRemovalGuard(subjectId: number) {
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  async function check(removedIds: number[], onProceed: () => void) {
    if (removedIds.length === 0) {
      onProceed()
      return
    }
    setIsChecking(true)
    let slots: number
    try {
      const { counts } = await getSubjectSlotCounts(subjectId)
      slots = counts
        .filter((c) => removedIds.includes(c.teacher_id))
        .reduce((total, c) => total + c.slots, 0)
    } catch {
      toast.error("Impossible de vérifier l’emploi du temps. Réessayez.")
      return
    } finally {
      setIsChecking(false)
    }
    if (slots > 0) setPendingRemoval({ slots, onProceed })
    else onProceed()
  }

  function confirm() {
    pendingRemoval?.onProceed()
    setPendingRemoval(null)
  }

  function cancel() {
    setPendingRemoval(null)
  }

  return { pendingRemoval, isChecking, check, confirm, cancel }
}
