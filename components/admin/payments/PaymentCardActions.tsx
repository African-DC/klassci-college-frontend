"use client"

import { CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { canCancelPayment, canValidatePayment, paymentSubject } from "@/lib/utils/payment-lifecycle"
import type { Payment } from "@/lib/contracts/payment"

interface PaymentCardActionsProps {
  payment: Payment
  onValidate: (payment: Payment) => void
  onCancel: (payment: Payment) => void
}

/**
 * Les gestes sous une carte tactile : boutons pleine largeur, `h-11`.
 *
 * C'est au téléphone que la caissière travaille, et la carte n'offrait rien —
 * livrer la correction comptable sans elle revenait à ne pas la livrer.
 *
 * Pas de bouton « reçu » ici : la carte entière l'ouvre déjà, et deux
 * commandes voisines pour une seule action coûteraient une carte par écran
 * sur cinq pouces. Le pied de carte, liseré compris, disparaît donc
 * entièrement quand il ne reste rien à faire — un versement déjà annulé ne
 * mérite pas une barre vide.
 *
 * Le nom de l'élève complète le libellé visible plutôt que de le remplacer :
 * la commande vocale doit continuer de répondre au mot affiché, qui reste
 * en tête de l'`aria-label`.
 *
 * Ce complément passe par `aria-label` et non par un `sr-only` commençant
 * par une espace : le calcul du nom accessible élague chaque nœud avant de
 * les concaténer, si bien que l'espace disparaît et qu'un lecteur d'écran
 * annonce « Annulerle versement ». Le défaut est muet à l'œil et n'apparaît
 * que si on lit le nom calculé.
 */
export function PaymentCardActions({ payment, onValidate, onCancel }: PaymentCardActionsProps) {
  const canValidate = canValidatePayment(payment.status)
  const canCancel = canCancelPayment(payment.status)
  if (!canValidate && !canCancel) return null

  const subject = paymentSubject(payment)

  return (
    <div className="flex gap-2 border-t px-3 py-2">
      {canValidate && (
        <Button
          type="button"
          variant="ghost"
          className="h-11 flex-1"
          onClick={() => onValidate(payment)}
          aria-label={`Valider le versement ${subject}`}
        >
          <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <span>Valider</span>
        </Button>
      )}

      {canCancel && (
        <Button
          type="button"
          variant="ghost"
          className="h-11 flex-1 text-destructive hover:text-destructive"
          onClick={() => onCancel(payment)}
          aria-label={`Annuler le versement ${subject}`}
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          <span>Annuler</span>
        </Button>
      )}
    </div>
  )
}
