import { isCashDue, type AllocationPreviewLine } from "@/lib/contracts/payment"

/**
 * Répartition d'un versement sur les frais d'une inscription.
 *
 * Le serveur reste maître du calcul : sans `allocations`, il déverse le
 * montant en cascade sur les frais dus, par ordre de priorité. Ce module ne
 * remplace pas cette cascade, il la rejoue à l'écran pour que l'encaisseur
 * voie où part le reliquat qu'il n'a pas nommé lui-même, avant d'enregistrer.
 */

/** Ce que l'encaisseur a tapé, tel quel, une chaîne par frais. */
export type AllocationDraft = Record<number, string>

/** Une allocation nommée, telle qu'elle part au serveur. */
export interface AllocationInput {
  enrollment_fee_id: number
  amount: number
}

export interface PlanLine {
  enrollmentFeeId: number
  name: string
  /** Reste dû en argent sur ce frais, avant ce versement. */
  due: number
  /** Ce que l'encaisseur a posé lui-même sur ce frais. */
  manual: number
  /** Ce que le reliquat y déverserait automatiquement. */
  auto: number
  /** Faux pour un frais exonéré ou réglé en nature : on n'y impute rien. */
  cashDue: boolean
  /** La saisie dépasse le reste dû de ce frais. */
  overDue: boolean
}

export interface AllocationPlan {
  lines: PlanLine[]
  /** Somme des montants nommés à la main. */
  manualTotal: number
  /** Somme déversée automatiquement sur les frais dus restants. */
  autoTotal: number
  /** Ce qui n'a pas encore été nommé, et partira donc en cascade. */
  toDistribute: number
  /** Ce qui ne trouve plus aucun frais dû où aller. */
  surplus: number
  /** La saisie dépasse le montant du versement. */
  overAllocated: boolean
  /** Au moins un frais reçoit plus que son reste dû. */
  hasLineError: boolean
  /** Rien ne s'oppose à l'envoi. */
  valid: boolean
}

/**
 * Lit un montant tapé au guichet : espaces de milliers, espace insécable et
 * virgule décimale comprises. Une saisie illisible vaut zéro, jamais NaN,
 * sinon un totalisateur affiche « NaN à répartir » pendant la frappe.
 */
export function parseAmount(raw: string | undefined | null): number {
  if (raw === undefined || raw === null) return 0
  const cleaned = raw.replace(/[\s  ]/g, "").replace(",", ".")
  if (cleaned === "") return 0
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value < 0) return 0
  return value
}

/** Reste dû en argent d'une ligne d'aperçu. Zéro si le frais n'est pas dû. */
export function feeDue(line: AllocationPreviewLine): number {
  if (!isCashDue(line.status_after)) return 0
  return Math.max(0, Number(line.fee_total) - Number(line.fee_paid_before))
}

/** L'ordre de priorité du serveur, rejoué à l'identique et de façon stable. */
function byPriority(a: AllocationPreviewLine, b: AllocationPreviewLine): number {
  const diff = a.fee_category_priority - b.fee_category_priority
  return diff !== 0 ? diff : a.enrollment_fee_id - b.enrollment_fee_id
}

/**
 * Construit la répartition affichée à partir de la saisie et de l'aperçu.
 *
 * `amount` est le montant du versement. Les montants nommés sont pris tels
 * quels, y compris quand ils dépassent (le plan le signale au lieu de les
 * rogner en silence : rogner ferait mentir le total affiché). Le reliquat
 * cascade ensuite sur ce qui reste dû, priorité croissante.
 */
export function buildAllocationPlan(
  previewLines: AllocationPreviewLine[],
  draft: AllocationDraft,
  amount: number,
): AllocationPlan {
  const ordered = [...previewLines].sort(byPriority)

  const lines: PlanLine[] = ordered.map((line) => {
    const due = feeDue(line)
    const cashDue = isCashDue(line.status_after)
    const manual = cashDue ? parseAmount(draft[line.enrollment_fee_id]) : 0
    return {
      enrollmentFeeId: line.enrollment_fee_id,
      name: line.fee_category_name,
      due,
      manual,
      auto: 0,
      cashDue,
      overDue: manual > due,
    }
  })

  const manualTotal = lines.reduce((total, line) => total + line.manual, 0)
  const versement = Number.isFinite(amount) && amount > 0 ? amount : 0
  const toDistribute = Math.max(0, versement - manualTotal)

  let reste = toDistribute
  for (const line of lines) {
    if (reste <= 0) break
    const capacite = Math.max(0, line.due - line.manual)
    if (capacite <= 0) continue
    line.auto = Math.min(capacite, reste)
    reste -= line.auto
  }

  const autoTotal = toDistribute - reste
  const overAllocated = manualTotal > versement
  const hasLineError = lines.some((line) => line.overDue)

  return {
    lines,
    manualTotal,
    autoTotal,
    toDistribute,
    surplus: reste,
    overAllocated,
    hasLineError,
    valid: !overAllocated && !hasLineError,
  }
}

/**
 * Ce qui part au serveur : uniquement les montants nommés à la main.
 *
 * Le reliquat n'est jamais renvoyé sous forme d'allocation. Il reste au
 * serveur, qui le cascade lui-même : c'est le comportement par défaut du
 * contrat, et le seul qui reste juste si l'état des frais a bougé entre
 * l'aperçu et l'enregistrement.
 */
export function toAllocationPayload(plan: AllocationPlan): AllocationInput[] {
  return plan.lines
    .filter((line) => line.manual > 0)
    .map((line) => ({ enrollment_fee_id: line.enrollmentFeeId, amount: line.manual }))
}
