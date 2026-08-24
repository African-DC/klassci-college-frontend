"use client"

import { CheckCircle, Eye, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { canCancelPayment, canValidatePayment, paymentSubject } from "@/lib/utils/payment-lifecycle"
import type { Payment } from "@/lib/contracts/payment"

interface PaymentRowActionsProps {
  payment: Payment
  onValidate: (payment: Payment) => void
  onCancel: (payment: Payment) => void
  onPreviewReceipt: (payment: Payment) => void
  /** Le reçu en cours de préparation, pour désactiver le seul bouton concerné. */
  previewBusy?: boolean
}

/**
 * Les gestes sur une ligne du tableau : trois icônes, alignées à droite.
 *
 * Icônes seules, donc chaque bouton porte son intitulé en `aria-label` et en
 * `title` — et nomme l'élève : sans lui, une liste de vingt lignes annonce
 * vingt fois « Annuler », sur un geste financier irréversible.
 *
 * La variante tactile est un composant distinct, `PaymentCardActions` : elle
 * n'a ni les mêmes gestes ni la même forme, et les réunir sous un drapeau
 * `stacked` faisait diverger six décisions sur un seul booléen.
 */
export function PaymentRowActions({
  payment,
  onValidate,
  onCancel,
  onPreviewReceipt,
  previewBusy = false,
}: PaymentRowActionsProps) {
  const subject = paymentSubject(payment)

  return (
    <div className="flex justify-end gap-2">
      {canValidatePayment(payment.status) && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => onValidate(payment)}
          title={`Valider le versement ${subject}`}
          aria-label={`Valider le versement ${subject}`}
        >
          <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        </Button>
      )}

      {canCancelPayment(payment.status) && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onCancel(payment)}
          title={`Annuler le versement ${subject}`}
          aria-label={`Annuler le versement ${subject}`}
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={() => onPreviewReceipt(payment)}
        disabled={previewBusy}
        title={`Voir le reçu ${subject}`}
        aria-label={`Voir le reçu ${subject}`}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
