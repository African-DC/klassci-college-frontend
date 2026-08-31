"use client"

import { useCallback, useMemo, useState } from "react"
import type { PaymentAllocationInput } from "@/lib/contracts/payment"

export type AllocationMode = "auto" | "manual"

/** Ce que l'encaisseur a tapé, tel quel, une chaîne par frais. */
export type AllocationDraft = Record<number, string>

/**
 * Lit un montant tapé au guichet : espaces de milliers, espace insécable et
 * virgule décimale comprises. Une saisie illisible vaut zéro, jamais NaN,
 * sinon un totalisateur afficherait « NaN à répartir » pendant la frappe.
 *
 * C'est de la lecture de champ de saisie, pas une règle d'imputation : ce que
 * ces montants deviennent une fois lus est décidé par le serveur, et par lui
 * seul.
 */
export function parseAmount(raw: string | undefined | null): number {
  if (raw === undefined || raw === null) return 0
  const cleaned = raw.replace(/[\s  ]/g, "").replace(",", ".")
  if (cleaned === "") return 0
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value < 0) return 0
  return value
}

/**
 * Le plafond du bouton « Le maximum » sur une ligne.
 *
 * Le plus contraignant des deux : ce que ce frais peut encore absorber, et ce
 * qui reste du versement une fois les autres lignes servies. `feeRemaining`
 * est rendu par le serveur, l'écran ne le calcule pas.
 */
export function capForFee(
  feeRemaining: number,
  amount: number,
  directedTotal: number,
  currentForFee: number,
): number {
  const disponible = amount - (directedTotal - currentForFee)
  return Math.max(0, Math.min(feeRemaining, disponible))
}

export interface AllocationDraftController {
  mode: AllocationMode
  setMode: (mode: AllocationMode) => void
  draft: AllocationDraft
  setFeeAmount: (feeId: number, raw: string) => void
  /** Met sur ce frais tout ce qu'il peut encore prendre sans dépasser. */
  fillFee: (feeId: number, feeRemaining: number, amount: number) => void
  clear: () => void
  /** Somme nommée, telle qu'elle vient d'être tapée, sans attendre l'aperçu. */
  directedTotal: number
  /** Ce qui part au serveur, à l'aperçu comme à l'enregistrement. */
  allocations: PaymentAllocationInput[] | undefined
}

/**
 * Tient la répartition saisie au guichet, et rien d'autre.
 *
 * Ce module ne décide pas où va l'argent : il porte ce que l'encaisseur a tapé
 * et le met en forme pour le serveur. La répartition qui s'affiche, y compris
 * la part cascadée et ce qui bloque l'enregistrement, vient de l'aperçu. Rejouer
 * ce calcul ici mettrait l'ordre de priorité et le sort d'un frais réglé en
 * nature en deux exemplaires, dans deux langages, et ils finiraient par
 * diverger sur de l'argent.
 *
 * L'état par défaut est l'automatique : c'est le cas courant, il ne doit
 * demander aucun geste. Passer en manuel n'efface pas ce qui a été tapé, et
 * revenir en automatique n'envoie plus rien de nommé.
 */
export function useAllocationDraft(): AllocationDraftController {
  const [mode, setMode] = useState<AllocationMode>("auto")
  const [draft, setDraft] = useState<AllocationDraft>({})

  const setFeeAmount = useCallback((feeId: number, raw: string) => {
    setDraft((current) => ({ ...current, [feeId]: raw }))
  }, [])

  const clear = useCallback(() => setDraft({}), [])

  const nommes = useMemo(
    () =>
      Object.entries(draft)
        .map(([feeId, raw]) => ({
          enrollment_fee_id: Number(feeId),
          amount: parseAmount(raw),
        }))
        .filter((ligne) => ligne.amount > 0),
    [draft],
  )

  const directedTotal = useMemo(
    () => nommes.reduce((total, ligne) => total + ligne.amount, 0),
    [nommes],
  )

  const fillFee = useCallback(
    (feeId: number, feeRemaining: number, amount: number) => {
      const montant = capForFee(
        feeRemaining,
        amount,
        directedTotal,
        parseAmount(draft[feeId]),
      )
      setDraft((current) => ({
        ...current,
        [feeId]: montant > 0 ? String(montant) : "",
      }))
    },
    [directedTotal, draft],
  )

  const allocations = useMemo(
    () => (mode === "manual" && nommes.length > 0 ? nommes : undefined),
    [mode, nommes],
  )

  return {
    mode,
    setMode,
    draft,
    setFeeAmount,
    fillFee,
    clear,
    directedTotal: mode === "manual" ? directedTotal : 0,
    allocations,
  }
}
