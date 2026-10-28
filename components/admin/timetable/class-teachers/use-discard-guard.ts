"use client"

import { useState } from "react"

/**
 * Garde les modifications non enregistrées : une sortie demandée pendant qu'il
 * y a des changements est mise en attente jusqu'à la confirmation.
 */
export function useDiscardGuard() {
  const [dirty, setDirty] = useState(false)
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null)

  function guard(leave: () => void) {
    if (!dirty) {
      leave()
      return
    }
    setPendingLeave(() => leave)
  }

  function confirmDiscard() {
    const leave = pendingLeave
    setPendingLeave(null)
    setDirty(false)
    leave?.()
  }

  return {
    setDirty,
    guard,
    discardOpen: pendingLeave !== null,
    confirmDiscard,
    cancelDiscard: () => setPendingLeave(null),
  }
}
