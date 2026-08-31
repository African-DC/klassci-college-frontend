import { isCashDue } from "@/lib/contracts/payment"

/**
 * Ce que l'écran sait des lignes de frais avant une régénération.
 *
 * Trois cas, pas deux. `isCashDue` est le prédicat du dépôt : une ligne
 * exonérée ou déposée en nature est soldée SANS versement. La compter parmi
 * les « lignes sans versement » ferait dire à la confirmation qu'elle sera
 * remplacée, ce qui n'est pas la même promesse.
 */
export interface FeeLineCounts {
  /** Dues en argent, un versement déjà imputé. */
  withPayments: number
  /** Dues en argent, aucun versement imputé. */
  withoutPayments: number
  /** Exonérées ou déposées en nature : soldées sans qu'un franc soit versé. */
  settledWithoutCash: number
}

export function countFeeLines(
  fees: ReadonlyArray<{ status: string; paid: number }>,
): FeeLineCounts {
  const counts: FeeLineCounts = { withPayments: 0, withoutPayments: 0, settledWithoutCash: 0 }
  for (const fee of fees) {
    if (!isCashDue(fee.status)) counts.settledWithoutCash += 1
    else if (fee.paid > 0) counts.withPayments += 1
    else counts.withoutPayments += 1
  }
  return counts
}
