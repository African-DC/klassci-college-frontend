"use client"

import { useCallback, useMemo, useState } from "react"
import {
  buildAllocationPlan,
  toAllocationPayload,
  type AllocationDraft,
  type AllocationInput,
  type AllocationPlan,
} from "@/lib/payments/allocation-plan"
import type { AllocationPreviewLine } from "@/lib/contracts/payment"

export type AllocationMode = "auto" | "manual"

export interface AllocationDraftController {
  mode: AllocationMode
  setMode: (mode: AllocationMode) => void
  draft: AllocationDraft
  setFeeAmount: (feeId: number, raw: string) => void
  /** Met sur ce frais tout ce qu'il peut encore prendre sans dépasser. */
  fillFee: (feeId: number) => void
  clear: () => void
  plan: AllocationPlan
  /** Ce qui part au serveur : `undefined` en automatique. */
  allocations: AllocationInput[] | undefined
  /** La saisie interdit l'enregistrement en l'état. */
  blocked: boolean
}

/**
 * Tient la répartition saisie au guichet.
 *
 * L'état par défaut est l'automatique : c'est le cas courant, il ne doit
 * demander aucun geste. Passer en manuel n'efface pas ce qui a été tapé, et
 * revenir en automatique n'envoie plus rien de nommé.
 */
export function useAllocationDraft(
  previewLines: AllocationPreviewLine[],
  amount: number,
): AllocationDraftController {
  const [mode, setMode] = useState<AllocationMode>("auto")
  const [draft, setDraft] = useState<AllocationDraft>({})

  const plan = useMemo(
    () => buildAllocationPlan(previewLines, mode === "manual" ? draft : {}, amount),
    [previewLines, draft, amount, mode],
  )

  const setFeeAmount = useCallback((feeId: number, raw: string) => {
    setDraft((current) => ({ ...current, [feeId]: raw }))
  }, [])

  const fillFee = useCallback(
    (feeId: number) => {
      const ligne = plan.lines.find((l) => l.enrollmentFeeId === feeId)
      if (!ligne) return
      // Le plafond, c'est le plus contraignant des deux : ce que le frais
      // peut encore absorber, et ce qui reste du versement.
      const disponible = plan.toDistribute + ligne.manual
      const montant = Math.min(ligne.due, disponible)
      setDraft((current) => ({
        ...current,
        [feeId]: montant > 0 ? String(montant) : "",
      }))
    },
    [plan],
  )

  const clear = useCallback(() => setDraft({}), [])

  const allocations = useMemo(
    () => (mode === "manual" ? toAllocationPayload(plan) : undefined),
    [mode, plan],
  )

  return {
    mode,
    setMode,
    draft,
    setFeeAmount,
    fillFee,
    clear,
    plan,
    allocations,
    blocked: mode === "manual" && !plan.valid,
  }
}
