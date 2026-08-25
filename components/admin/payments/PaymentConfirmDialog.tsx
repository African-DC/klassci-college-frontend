"use client"

import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import type { Payment } from "@/lib/contracts/payment"

/** Le serveur exige la même longueur : une phrase, pas un mot. */
const MOTIF_MINIMUM = 10

export interface PaymentConfirmAction {
  type: "validate" | "cancel"
  payment: Payment
}

interface PaymentConfirmDialogProps {
  action: PaymentConfirmAction | null
  onClose: () => void
  /** `reason` n'est renseigné que pour une annulation. */
  onConfirm: (reason: string) => void
  busy: boolean
}

/**
 * La confirmation avant de valider ou d'annuler un versement.
 *
 * Le motif d'annulation vit ici, et nulle part ailleurs : il ne concerne que
 * ce dialogue, et le laisser dans la page obligeait celle-ci à le remettre à
 * zéro à chaque fermeture, à deux endroits différents.
 *
 * La longueur minimale reprend celle du serveur pour que le refus arrive avant
 * l'envoi : mieux vaut que la personne qui annule voie tout de suite qu'elle
 * signe une phrase, puisque cette phrase ira sur le bordereau de caisse et sur
 * le reçu réimprimé.
 */
export function PaymentConfirmDialog({
  action,
  onClose,
  onConfirm,
  busy,
}: PaymentConfirmDialogProps) {
  const [motif, setMotif] = useState("")
  const motifTropCourt = motif.trim().length < MOTIF_MINIMUM

  // Un motif saisi puis abandonné ne doit pas réapparaître sur le versement
  // suivant : ce serait signer l'annulation d'un autre avec la phrase d'avant.
  useEffect(() => {
    if (!action) setMotif("")
  }, [action])

  const annulation = action?.type === "cancel"
  const montant = action ? Number(action.payment.amount).toLocaleString("fr-FR") : ""

  return (
    <AlertDialog open={!!action} onOpenChange={(open) => { if (!open) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {annulation ? "Annuler ce paiement ?" : "Valider ce paiement ?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {annulation
              ? `Le versement de ${montant} FCFA ne sera pas supprimé : il restera dans le journal, marqué annulé, avec votre nom et votre motif. Le reçu réimprimé le dira aussi.`
              : `Vous allez valider le paiement de ${montant} FCFA. Cette action est irréversible.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {annulation && (
          <div className="space-y-1.5">
            <label htmlFor="motif-annulation" className="text-sm font-medium">
              Motif de l&apos;annulation *
            </label>
            <Textarea
              id="motif-annulation"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : montant saisi en trop, la caisse ne contient pas ces 5 000 F."
              rows={3}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Une phrase, pas un mot : elle figurera sur le bordereau de caisse et sur le
              reçu.
            </p>
            <p className="rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-900 dark:text-amber-200">
              À n&apos;utiliser que si <strong>aucun argent n&apos;a bougé</strong> : une
              saisie en trop, un double. Si l&apos;argent a bien été encaissé, annuler le
              ferait disparaître alors qu&apos;il est dans le tiroir, et la caisse serait
              en excédent inexpliqué à la clôture. Passez par la comptabilité.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Retour</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(motif.trim())}
            disabled={busy || (annulation && motifTropCourt)}
          >
            {busy ? "Traitement..." : annulation ? "Annuler le paiement" : "Valider"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
